Rails.application.routes.draw do
  devise_for :users, 
    defaults: { format: :json}, 
    controllers: {
      sessions: 'api/v1/sessions', 
      registrations: 'api/v1/registrations', 
      passwords: 'api/v1/passwords'
    }, 
    path: '', 
    path_names: {
      sign_in: 'api/v1/login',
      sign_out: 'api/v1/logout',
      registration: 'api/v1/signup', 
      password: 'api/v1/password'
    }

  devise_scope :user do
    post '/api/v1/login/verify_otp', to: 'api/v1/sessions#verify_otp'
  end

  get "/up", to: proc { [200, {}, ["OK"]] }

  namespace :api do 
    namespace :v1 do 

      resources :job_descriptions, only: [:index, :show, :create, :destroy] do 
        member do
          post :analyze
          get :analysis_status
        end
      end  

      #User Profiles 
      get '/profile', to: 'users#show'
      put '/profile', to: 'users#update'

      # Two-Factor Authentication
      get '/two_factor/setup', to: 'two_factor#setup'
      post '/two_factor/enable', to: 'two_factor#enable'
      delete '/two_factor/disable', to: 'two_factor#disable'
      get '/two_factor/status', to: 'two_factor#status'
      post '/two_factor/regenerate_backup_codes', to: 'two_factor#regenerate_backup_codes'

      # OTP verification for login
      # post '/login/verify_otp', to: 'sessions#verify_otp'


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


  root to: 'api/v1/health#show'
end
