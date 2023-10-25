/** Routes for companies. */
// https://json-schema.org/draft/2019-09/schema"
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedInAndIsAdminOrIsUser } = require("../middleware/auth");

const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be {  title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle  }
 *
 * Authorization required: login
 */

router.post(
  "/",
  ensureLoggedInAndIsAdminOrIsUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - hasEquity
 * - minSalary
 * - title (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const job = await Job.findAll();
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /filter  =>  { filteredJobs : [{job}]}
 *
 *  job is { id, title, salary, equity, company_handle }
 *  Pass in filter requirments in query string
 *  current exceptable filters : [title, hasEquity, minSalary]
 *
 * Authorization required: none
 */
router.get("/filter", async function (req, res, next) {
  try {
    const query = req.query;
    const filteredJobs = await Job.filter(query);
    return res.json({ filteredJobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  job is { id, title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.patch(
  "/:id",
  ensureLoggedInAndIsAdminOrIsUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete(
  "/:id",
  ensureLoggedInAndIsAdminOrIsUser,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
