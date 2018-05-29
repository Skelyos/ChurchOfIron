const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const nodeWarSchema = new Schema({
    JoinString: String,
    NodewarName: String,
    DateOfActivity: String,
    AverageRs: Number,
    PeopleAttending: Array
});

module.exports = mongoose.model('Nodewar', nodeWarSchema);