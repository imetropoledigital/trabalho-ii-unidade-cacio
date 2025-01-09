/*
 * Convert a string of fields to a projection object
 * @param {String} fields - The fields to project
 * @returns {Object} - The projection object
 * 
*/
const projectionFieldsToProjection = (fields) => {
  return fields
    .split(',')
    .map(field => field.trim())
    .filter(field => field)
    .reduce((projection, field) => {
      if (field.startsWith('-')) {
        projection[field.slice(1)] = 0;
      } else {
        projection[field] = 1;
      }
      return projection;
    }, {});
}

module.exports = {
  projectionFieldsToProjection,
};
