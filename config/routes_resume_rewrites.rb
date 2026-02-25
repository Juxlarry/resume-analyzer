namespace :api do
  namespace :v1 do
    resources :resume_analyses, only: [] do
      resources :rewrites, controller: "resume_rewrites", only: %i[create index]
    end

    resources :resume_rewrites, only: %i[show] do
      member do
        get "download/latex", action: :download_latex
        get "download/pdf", action: :download_pdf
      end
    end
  end
end
