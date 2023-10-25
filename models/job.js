"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { Filter, jobFilterFuncs } = require("./filter");

/** Related functions for jobs. */

class Job {
  /** Create a Job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`
    );
    return jobsRes.rows;
  }

  /** Find all jobs that match filter requirements
   *
   * Check the users request query and find filter names that match the filter methods.
   *
   * When a filter method is matched, call that method and concat the returned SQL query to the main sql query body
   *
   * body - "SELECT * FROM jobs WHERE", concated info from Filter methods - "title LIKE '%agust%' AND min_salary = 50,000"
   *
   * Returns  { filteredJobs : [{ id, title, salary, equity, company_handle  }, ...]}
   * */

  static async filter(query) {
    let querysql = `
    SELECT id,
    title,
    salary,
    equity,
    company_handle AS "companyHandle"
    FROM jobs
    WHERE 1=1
    `;

    for (let queryKey of Object.keys(query)) {
      if (Object.keys(jobFilterFuncs).indexOf(queryKey) === -1) {
        throw new BadRequestError(`${queryKey} is an Invalid Filter type`);
      }
      Object.keys(jobFilterFuncs).forEach((filterKey) => {
        if (filterKey === queryKey) {
          querysql =
            querysql +
            " " +
            "AND" +
            " " +
            jobFilterFuncs[filterKey](query[queryKey]);
        }
      });
    }
    const filteredJobs = await db.query(querysql);
    if (filteredJobs.rows.length === 0) {
      return new NotFoundError(
        "There arn't any jobs matching your requirments"
      );
    }
    return filteredJobs.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns {id, title, salary, equity, company_handle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
        title,
        salary,
        equity,
        company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
