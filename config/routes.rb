Rails.application.routes.draw do
  mount Rswag::Api::Engine => '/api-docs'
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

  instance_eval(File.read(Rails.root.join("config/routes_resume_rewrites.rb")))

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

      # API for parsing job descriptions with AI
      post "job_descriptions/parse_pdf_text", to: "job_description_parser#parse"



      get '/health', to: 'health#show'

      namespace :admin do
        get 'dashboard/stats', to: 'dashboard#stats'
        resources :users, only: [:index, :show, :update, :destroy] do
          collection do 
            get :export
          end 
        end

        resources :jobs, only: [:index, :destroy] do
          collection do
            get :export
          end 
        end 


        # Activity logs
        resources :activity_logs, only: [:index] do
          collection do
            get :stats
          end
        end
      end
    end 
  end 

  # Sidekiq Web UI (protect this in production!)
  require 'sidekiq/web'
  # Basic Auth for Sidekiq Dashboard
  if Rails.env.production?
    Sidekiq::Web.use Rack::Auth::Basic do |username, password|
      # Set these in your Render/Railway ENV variables
      ActiveSupport::SecurityUtils.secure_compare(::Digest::SHA256.hexdigest(username), ::Digest::SHA256.hexdigest(ENV["SIDEKIQ_USERNAME"])) &
        ActiveSupport::SecurityUtils.secure_compare(::Digest::SHA256.hexdigest(password), ::Digest::SHA256.hexdigest(ENV["SIDEKIQ_PASSWORD"]))
    end
  end
  
  mount Sidekiq::Web => '/sidekiq'


  root to: 'api/v1/health#show'
end
