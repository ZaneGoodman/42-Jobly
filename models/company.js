"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { Filter, companyFilterFuncs } = require("./filter");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /** Find all companies that match filter requirements
   *
   * Check the users request query and find filter names that match the filter methods.
   *
   * When a filter method is matched, call that method and concat the returned SQL query to the main sql query body
   *
   * body - "SELECT * FROM companies WHERE", concated info from Filter methods - "name LIKE '%agust%' AND num_employees = 5"
   *
   * Returns  { filteredCompanies : [{ handle, name, description, numEmployees, logoUrl }, ...]}
   *
   * Throws Errors if : User passes in incorrect filter option, if minEmps > maxEmps, and if there are no companies found that match the users requirments
   * */

  static async filter(query) {
    if (query["minEmployees"] && query["maxEmployees"]) {
      if (query["minEmployees"] > query["maxEmployees"]) {
        throw new BadRequestError(
          "Minimum Employees canno't be greater than Maximum Employees"
        );
      }
    }
    let querysql = `
    SELECT handle,
    name,
    description,
    num_employees AS "numEmployees",
    logo_url AS "logoUrl"
    FROM companies
    WHERE 1=1
    `;

    for (let queryKey of Object.keys(query)) {
      if (Object.keys(companyFilterFuncs).indexOf(queryKey) === -1) {
        throw new BadRequestError(`${queryKey} is an Invalid Filter type`);
      }
      Object.keys(companyFilterFuncs).forEach((filterKey) => {
        if (filterKey === queryKey) {
          querysql =
            querysql +
            " " +
            "AND" +
            " " +
            companyFilterFuncs[filterKey](query[queryKey]);
        }
      });
    }
    const filteredCompanies = await db.query(querysql);
    if (filteredCompanies.rows.length === 0) {
      return new NotFoundError(
        "There arn't any companies matching your requirments"
      );
    }
    return filteredCompanies.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(companyHandle) {
    const companyRes = await db.query(
      `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id,
                  j.title,
                  j.salary,
                  j.equity,
                  j.company_handle AS "companyHandle"
           FROM companies AS c
           LEFT JOIN jobs AS j
           ON c.handle = j.company_handle
           WHERE c.handle = $1`,
      [companyHandle]
    );
    if (!companyRes.rows[0])
      throw new NotFoundError(`No company: ${companyHandle}`);
    const { handle, name, description, numEmployees, logoUrl } =
      companyRes.rows[0];

    const jobs = companyRes.rows.map((val) => {
      if (!val.id) return {};
      return {
        id: val.id,
        title: val.title,
        salary: val.salary,
        equity: val.equity,
        companyHandle: val.companyHandle,
      };
    });

    return { handle, name, description, numEmployees, logoUrl, jobs };
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
