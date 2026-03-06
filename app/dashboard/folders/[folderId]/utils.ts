type Folder = {
  id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_opened: string;
  folder_repos: {
    repo_id: string;
    added_at: string;
    repositories: {
      id: string;
      url: string;
      name: string;
      forks: number;
      stars: number;
      private: boolean;
      user_id: string;
      language: string;
      full_name: string;
      synced_at: string;
      updated_at: string;
      description: string;
      github_repo_id: number;
    };
  }[];
};
