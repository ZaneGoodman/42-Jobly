"use strict";

const db = require("../db.js");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError.js");

const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "publix",
    salary: 10000,
    equity: "0",
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.title).toEqual(newJob.title);
    expect(job.companyHandle).toEqual(newJob.companyHandle);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "publix",
        salary: 10000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
  test("err if title not provided", async function () {
    try {
      await Job.create({
        salary: 10000,
        equity: "0",
        companyHandle: "c3",
      });
      fail();
    } catch (err) {
      expect(err).not.toContain("c3");
    }
  });
});
/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        companyHandle: "c2",
        equity: "1",
        id: 2,
        salary: 100000,
        title: "target",
      },
      {
        companyHandle: "c1",
        equity: "0",
        id: 1,
        salary: 50000,
        title: "walmart",
      },
    ]);
  });
});

/************************************** filter */
describe("filter", function () {
  test("works with all filters", async function () {
    const job = await Job.filter({
      jobTitle: "wal",
      minSalary: 5000,
      hasEquity: "false",
    });
    expect(job).toEqual([
      {
        companyHandle: "c1",
        equity: "0",
        id: 1,
        salary: 50000,
        title: "walmart",
      },
    ]);
  });
  test("works with only minSalary Filter", async function () {
    const job = await Job.filter({
      minSalary: 5000,
    });
    expect(job).toEqual([
      {
        companyHandle: "c1",
        equity: "0",
        id: 1,
        salary: 50000,
        title: "walmart",
      },
      {
        companyHandle: "c2",
        equity: "1",
        id: 2,
        salary: 100000,
        title: "target",
      },
    ]);
  });
  test("works with only jobTitle and hasEquity Filters", async function () {
    const job = await Job.filter({
      jobTitle: "t",
      hasEquity: "true",
    });
    expect(job).toEqual([
      {
        companyHandle: "c2",
        equity: "1",
        id: 2,
        salary: 100000,
        title: "target",
      },
    ]);
  });
  test("works with only hasEquity Filter", async function () {
    const job = await Job.filter({
      hasEquity: "false",
    });
    expect(job).toEqual([
      {
        companyHandle: "c1",
        equity: "0",
        id: 1,
        salary: 50000,
        title: "walmart",
      },
      {
        companyHandle: "c2",
        equity: "1",
        id: 2,
        salary: 100000,
        title: "target",
      },
    ]);
  });
  test("works with only hasEquity and jobTitle Filter with all CAPS", async function () {
    const job = await Job.filter({
      hasEquity: "FALSE",
      jobTitle: "T",
    });
    expect(job).toEqual([
      {
        companyHandle: "c1",
        equity: "0",
        id: 1,
        salary: 50000,
        title: "walmart",
      },
      {
        companyHandle: "c2",
        equity: "1",
        id: 2,
        salary: 100000,
        title: "target",
      },
    ]);
  });
  test("throws express error if hasEquity is not true or false", async function () {
    try {
      await Job.filter({
        hasEquity: "wubalubadubdub",
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
    }
  });

  test("throws notFoundError if no jobs are found with provided filters", async function () {
    try {
      await Job.filter({
        jobTitle: "pub",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("throws BadRequestError if invalid filter type", async function () {
    try {
      await Job.filter({
        jooobtiile: 5,
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("throws Express Error if minSalary is not type integer", async function () {
    try {
      await Job.filter({
        minSalary: "cat in the hat",
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      companyHandle: "c1",
      equity: "0",
      id: 1,
      salary: 50000,
      title: "walmart",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(4);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    equity: "1",
    salary: 500000,
    title: "wally world",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      companyHandle: "c1",
      equity: "1",
      id: 1,
      salary: 500000,
      title: "wally world",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        company_handle: "c1",
        equity: "1",
        id: 1,
        salary: 500000,
        title: "wally world",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      companyHandle: "c1",
      equity: null,
      id: 1,
      salary: null,
      title: "New",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        company_handle: "c1",
        equity: null,
        id: 1,
        salary: null,
        title: "New",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(4, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(4);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
