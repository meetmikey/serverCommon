var mongoose = require ('mongoose')
var Schema = mongoose.Schema;

var Counter = new Schema({
  model : {type: String},
  count : {type : Number, default : 1}
});

Counter.index ({model : 1, count : 1}, {unique : true});

mongoose.model('Counter', Counter);
exports.CounterModel = mongoose.model('Counter');