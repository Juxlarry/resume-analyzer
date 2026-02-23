# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Development origins
    dev_origins = [
      "http://localhost:4200",
      "http://127.0.0.1:4200"
    ]

    # Production origins from environment variables.
    # FRONTEND_URL supports one origin, FRONTEND_URLS supports comma-separated origins.
    configured_origins = []
    configured_origins << ENV["FRONTEND_URL"] if ENV["FRONTEND_URL"].present?

    if ENV["FRONTEND_URLS"].present?
      configured_origins.concat(ENV["FRONTEND_URLS"].split(","))
    end

    configured_origins = configured_origins
      .map { |origin| origin.to_s.strip.sub(%r{/\z}, "") }
      .reject(&:empty?)

    # Combine all origins
    allowed_origins = (dev_origins + configured_origins).uniq

    # Optional Vercel preview support:
    # VERCEL_PROJECT_PREFIX=resume-analyzer will allow
    # https://resume-analyzer-*.vercel.app
    vercel_project_prefix = ENV["VERCEL_PROJECT_PREFIX"].to_s.strip
    vercel_preview_regex = if vercel_project_prefix.present?
      /\Ahttps:\/\/#{Regexp.escape(vercel_project_prefix)}(?:-[a-z0-9-]+)?\.vercel\.app\z/i
    end

    if vercel_preview_regex
      origins(*allowed_origins, vercel_preview_regex)
    else
      origins(*allowed_origins)
    end

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true, # Changed to true for JWT auth
      expose: ['Authorization']
  end
end
