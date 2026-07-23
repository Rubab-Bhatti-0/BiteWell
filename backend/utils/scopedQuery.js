function scopedFilter(req, extraFilter = {}) {
  if (!req.user?.clinicId) {
    const error = new Error('Authenticated clinic context is required.');
    error.statusCode = 401;
    throw error;
  }

  // clinicId is deliberately applied last so callers cannot override it.
  return { ...extraFilter, clinicId: req.user.clinicId };
}

function scopedQuery(req, Model, extraFilter = {}) {
  return Model.find(scopedFilter(req, extraFilter));
}

scopedQuery.filter = scopedFilter;
scopedQuery.findOne = (req, Model, extraFilter = {}) => (
  Model.findOne(scopedFilter(req, extraFilter))
);

module.exports = scopedQuery;
