var request = require('request')
var prompt = require('prompt')
var pick = require('lodash.pick')

var params;

var schema = {
  properties: {
    email: { required: true, description: 'whats ur email ?' },
    password: { hidden: true, replace: '$', description: 'whats ur password ?' }
  }
}

prompt.get(schema, function (err, result) {
  params = result
  var client = new CobudgetClient(params)
})


function CobudgetClient (params) {
  this.authHeaders = {}
  this.baseUri = 'https://cobudget-beta-api.herokuapp.com/api/v1'
  var self = this
  request.post({
    uri: self.baseUri + '/auth/sign_in',
    form: params
  }, function (err, response, body) {
    var headers = response.toJSON().headers
    self.authHeaders = pick(headers, ['access-token', 'uid', 'client', 'token-type'])
    self.getMe(function (err, me) {
      console.log('me: ', me)
    })
    // test get
  })
}

CobudgetClient.prototype.getMe = function (callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/users/me',
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body));
  });
}
