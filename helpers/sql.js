const { max } = require("pg/lib/defaults");
const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// dataToUpdate - { firstName, lastName, password, email, isAdmin } - This is from the request body from the user
//jsToSql -  {
          // firstName: "first_name",
          // lastName: "last_name",
          // isAdmin: "is_admin",
        // }
        // - This is an object containing keys(These are the CamelCased key names shown to the user),
        // - and the values(These are the snake_cased keys used in Postgresql).

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  //   - Convert the data from the request body into column names(using the data's keys)
  //     with the appropriate value identifier
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Join the converted sql-data with comma's and include the vlaues from the dataToUpdate data
  // { 
  //  setCols: ['"first_name"=$1', '"last_name"=$2', '"isAdmin"=$3'],
  //  values: ["zane", "goodman", "false"]
  //}
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

min 
max
name
min max
min name
max name 
min max name 
where numEmp <= min 
if(min) {
  sql = 'sfsaf'
}
if(max) {
  sql = 'sfsf'
}
if(min && max) {
  sql - 'asfsf between fasfs and sffsd'
}
if(name) {
  sql = sql + 'like %fdsf%'
}