/* jshint node:true */

'use strict';

var _ = require('lodash');
var assert = require('assert');

function MemoryModel(name) {
	assert(name && _.isString(name), 'A name is required to create a model');
	this.name = name;
	this.records = {};
}

MemoryModel.prototype.name = null;

MemoryModel.prototype.records = null;

MemoryModel.prototype.wipe = function *() {
	this.records = {};
};

MemoryModel.prototype.insert = function *(task) {
	task._id = _.uniqueId(this.name + '_');
	this.records[task._id] = task;
	return task;
};

MemoryModel.prototype.update = function *(taskId, updates) {
	if (this.records[taskId]) {
		_.extend(this.records[taskId], updates);
	}
	return this.records[taskId];
};

MemoryModel.prototype.delete = function *(taskId) {
	var task = this.records[taskId];
	delete this.records[taskId];
	return task;
};

MemoryModel.prototype.findById = function *(taskId) {
	return this.records[taskId];
};

MemoryModel.prototype.findOne = function *(criteria, sort) {
	var found;
	if (!sort) {
		found = _.find(this.records, criteria);
	} else {
		var multipleFound = _.filter(this.records, criteria);

		// if no records or only one record, dont bother with sorting
		if (multipleFound.length <= 1) {
			found = multipleFound[0];
		} else {
			// every lets us short circuit if we dont need to loop through all the sort keys if only one record is left
			_.every(sort, function(order, key) {
				multipleFound = _.reduce(multipleFound, function(foundSoFar, next) {
					// if same as current - push to list and it will be handled by next sort key or first will be returned
					if (foundSoFar[0] && foundSoFar[0][key] === next[key]) {
						foundSoFar.push(next);
					// ascending order - create new array with just the new item if its key is smaller than those found so far
					} else if (order === 1 && foundSoFar[0][key] > next[key]) {
						foundSoFar = [next];
					// descending order - create new array with just the new item if its key is greater than those found so far
					} else if (order === -1 && foundSoFar[0][key] < next[key]) {
						foundSoFar = [next];
					}
					return foundSoFar;
				}, [multipleFound[0]]);
				return (multipleFound.length > 1);
			});
			found = multipleFound[0];
		}
	}
	return found;
};

function MemoryDb() {
	this.models = {};
}

MemoryDb.prototype.name = 'memorydb';

MemoryDb.prototype.models = null;

MemoryDb.prototype.Model = MemoryModel;

MemoryDb.prototype.model = function(name) {
	this.models[name] = this.models[name] || new this.Model(name);
	return this.models[name];
};

module.exports = function() {
	return new MemoryDb();
};