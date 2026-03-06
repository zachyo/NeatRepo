import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );
  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace_id');

    // Get files in workspace
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspace_id') as string;
    const folderId = formData.get('folder_id') as string | null;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(`${workspaceId}/${fileName}`, file);

    if (uploadError) throw uploadError;

    // Create file record in database
    const { data, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          name: file.name,
          size: file.size,
          type: file.type,
          workspace_id: workspaceId,
          folder_id: folderId,
          owner_id: userId,
          storage_path: `${workspaceId}/${fileName}`,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
