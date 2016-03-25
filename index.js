var request = require('request')
var prompt = require('prompt')
var pick = require('lodash.pick')
var async = require('async')

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
    async.parallel({
      me: self.getMe.bind(self),
      group: async.apply(self.getGroup.bind(self), 41),
      buckets: function (callback) {
        self.getBucketsForGroup({ id: 41 }, function (err, buckets) {
          if (err) return callback(err);
          async.map(buckets, function (bucket, cb) {
            async.parallel({
              comments: async.apply(self.getCommentsForBucket.bind(self), bucket),
              contributions: async.apply(self.getContributionsForBucket.bind(self), bucket)
            }, function (err, results) {
              bucket.contributions = results.contributions
              bucket.comments = results.comments
              cb(null, bucket)
            })
          }, callback)
        });
      },
      allocations: async.apply(self.getAllocationsForGroup.bind(self), { id: 41 })
    }, function (err, results) {
      console.log('results: ', JSON.stringify(results))
    });
  })
}

CobudgetClient.prototype.getMe = function (callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/users/me',
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).users[0]);
  });
}

CobudgetClient.prototype.getGroup = function (id, callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/groups/' + id,
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).groups[0]);
  });
}

CobudgetClient.prototype.getBucketsForGroup = function (group, callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/buckets?group_id=' + group.id,
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).buckets);
  });
}

CobudgetClient.prototype.getAllocationsForGroup = function (group, callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/allocations?group_id=' + group.id,
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).allocations);
  });
}

CobudgetClient.prototype.getContributionsForBucket = function (bucket, callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/contributions?bucket_id=' + bucket.id,
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).contributions);
  });
}

CobudgetClient.prototype.getCommentsForBucket = function (bucket, callback) {
  var self = this
  request.get({
    uri: self.baseUri + '/comments?bucket_id=' + bucket.id,
    headers: self.authHeaders
  }, function (err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).comments);
  });
}
