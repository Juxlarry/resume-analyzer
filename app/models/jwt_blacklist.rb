#Again naming convention erros happened here in JWT usage. To be able to keep the file name as 'jwt_blacklist.rb', Class name nnow become 'class JwtBlacklist'
#Otherwise the file would have to be named: 'j_w_t_blacklist.rb' for the class name to remain: 'class JWTBlacklist'
class JwtBlacklist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist
  self.table_name = 'jwt_blacklists'
end