function clinicFilter(req, extraFilter = {}) {
  if (!req.user || !req.user.clinicId) {
    throw new Error('Authenticated clinic context is required.');
  }

  // clinicId is intentionally applied last so callers cannot override it.
  return { ...extraFilter, clinicId: req.user.clinicId };
}

function scopedQuery(req, Model, extraFilter = {}) {
  return Model.find(clinicFilter(req, extraFilter));
}

scopedQuery.filter = clinicFilter;
scopedQuery.findOne = (req, Model, extraFilter = {}) =>
  Model.findOne(clinicFilter(req, extraFilter));
scopedQuery.countDocuments = (req, Model, extraFilter = {}) =>
  Model.countDocuments(clinicFilter(req, extraFilter));

module.exports = scopedQuery;
