function scopedQuery(req, Model, extraFilter = {}) {
  return Model.find({ clinicId: req.user.clinicId, ...extraFilter });
}

module.exports = scopedQuery;
