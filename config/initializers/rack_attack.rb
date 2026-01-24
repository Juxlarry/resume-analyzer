class Rack::Attack
  ### Configure Cache ###
  # Use Rails cache for storing request counts
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Throttle Requests ###

  # Adjust limits based on environment
#   if Rails.env.development?
#     throttle('req/ip', limit: 300, period: 1.minute) { |req| req.ip }
#     throttle('logins/ip', limit: 20, period: 20.seconds) { |req| req.ip if req.path == '/api/v1/login' && req.post? }
#   else
#     throttle('req/ip', limit: 60, period: 1.minute) { |req| req.ip }
#     throttle('logins/ip', limit: 5, period: 20.seconds) { |req| req.ip if req.path == '/api/v1/login' && req.post? }
#   end

  
  # Throttle all requests by IP (60rpm per IP)
  throttle('req/ip', limit: 60, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Throttle login attempts by IP address
  throttle('logins/ip', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/login' && req.post?
      req.ip
    end
  end

  # Throttle login attempts by email address
  throttle('logins/email', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/login' && req.post?
      # Extract email from request body
      req.params['user']&.dig('email')&.downcase&.presence
    end
  end

  # Throttle signup attempts
  throttle('signups/ip', limit: 3, period: 1.hour) do |req|
    if req.path == '/api/v1/signup' && req.post?
      req.ip
    end
  end

  # Throttle CV analysis submissions
  throttle('analysis/ip', limit: 10, period: 1.hour) do |req|
    if req.path.match?(%r{/api/v1/job_descriptions/\d+/analyze}) && req.post?
      req.ip
    end
  end

  ### Custom Throttle Response ###
  self.throttled_responder = lambda do |env|
    retry_after = (env['rack.attack.match_data'] || {})[:period]
    [
      429,
      {
        'Content-Type' => 'application/json',
        'Retry-After' => retry_after.to_s
      },
      [{ error: 'Rate limit exceeded. Please try again later.' }.to_json]
    ]
  end

  ### Blocklists & Safelists ###
  
  # Always allow requests from localhost (for development)
  safelist('allow-localhost') do |req|
    req.ip == '127.0.0.1' || req.ip == '::1'
  end

  # Block suspicious requests
  blocklist('block-bad-actors') do |req|
    # Block if User-Agent is missing or looks suspicious
    req.user_agent.blank? || req.user_agent =~ /curl|wget|python/i
  end
end