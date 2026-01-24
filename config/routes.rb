Rails.application.routes.draw do
  devise_for :users, 
    defaults: { format: :json}, 
    controllers: {
      sessions: 'api/v1/sessions', 
      registrations: 'api/v1/registrations'
    }, 
    path: '',  # Removes /users prefix
    path_names: {
      sign_in: 'api/v1/login',
      sign_out: 'api/v1/logout',
      registration: 'api/v1/signup'
    }

  # Simple health check for load balancers (root level)
  get "/up", to: proc { [200, {}, ["OK"]] }

  namespace :api do 
    namespace :v1 do 

      resources :cv_analyses
      resources :job_descriptions, only: [:index, :show, :create, :destroy] do 
        post :analyze, on: :member
        get :analysis_status, on: :member
      end  

      #User Profiles 
      get '/profile', to: 'users#show'
      put '/profile', to: 'users#update'


      # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

      # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
      # Can be used by load balancers and uptime monitors to verify that the app is live.
      # get "/up" => "health#show", as: :rails_health_check

      # can also have a /health endpoint 
      get '/health', to: 'health#show'
    end 
  end 

  # Sidekiq Web UI (protect this in production!)
  require 'sidekiq/web'
  mount Sidekiq::Web => '/sidekiq'

  
  # Defines the root path route ("/")
  # root "posts#index"
  # Root path (optional - could be Angular app or API info)
  root to: 'api/v1/health#show'
end
