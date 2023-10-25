const { ExpressError } = require("../expressError");

// Pass in information from the users query string into Filter methods
// Returns the proper piece of an SQL query to be added together in the company model

class Filter {
  static minEmployees(num) {
    if (!parseInt(num)) {
      throw new ExpressError("MinEmployees must be type Integer", 404);
    }
    const sql = `num_employees >= ${num}`;

    return sql;
  }
  static maxEmployees(num) {
    if (!parseInt(num)) {
      throw new ExpressError("MaxEmployees must be type Integer", 404);
    }
    const sql = `num_employees <= ${num}`;
    return sql;
  }
  static companyName(string) {
    const sql = `LOWER(name) LIKE '%${string.toLowerCase()}%'`;
    return sql;
  }
  static jobTitle(string) {
    const sql = `LOWER(title) LIKE '%${string.toLowerCase()}%'`;
    return sql;
  }
  static minSalary(num) {
    if (!parseInt(num)) {
      throw new ExpressError("minSalary must be type Integer", 404);
    }
    const sql = `salary >= ${num}`;
    return sql;
  }
  static hasEquity(boolean) {
    let bool = boolean.toLowerCase();
    if (bool !== "true" && bool !== "false") {
      throw new ExpressError(`hasEquity must be type 'true' or 'false'`, 404);
    }
    let sql;
    if (bool === "true") {
      sql = `equity = 1`;
      return sql;
    } else {
      sql = `equity >= 0 AND equity <= 1`;
      return sql;
    }
  }
}

const companyFilterFuncs = {
  minEmployees: Filter.minEmployees,
  maxEmployees: Filter.maxEmployees,
  companyName: Filter.companyName,
};
const jobFilterFuncs = {
  jobTitle: Filter.jobTitle,
  minSalary: Filter.minSalary,
  hasEquity: Filter.hasEquity,
};

module.exports = { Filter, companyFilterFuncs, jobFilterFuncs };
