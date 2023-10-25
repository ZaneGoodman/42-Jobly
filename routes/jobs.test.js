"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "walmart",
    salary: 75000,
    equity: 1,
    companyHandle: "c1",
  };

  test("ok for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "walmart",
        salary: 75000,
        equity: "1",
        companyHandle: "c1",
      },
    });
  })
    test("bad request with missing data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "walmart",
          salary: 75000,
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "walmart",
          salary: 75000,
          equity: "Not an integer",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      job: [
        {
          companyHandle: "c2",
          equity: "1",
          id: expect.any(Number),
          salary: 100000,
          title: "target",
        },
        {
          companyHandle: "c1",
          equity: "0",
          id: expect.any(Number),
          salary: 50000,
          title: "walmart",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// /************************************** GET /companies/filter */
describe("GET /jobs/filter", function () {
  test("works with all current filters", async function () {
    const resp = await request(app).get(`/jobs/filter`).query({
    minSalary: 50000,
    hasEquity: "false",
    jobTitle: 'wal'
    });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      filteredJobs: [
        {
          companyHandle: "c1",
          equity: "0",
          id: expect.any(Number),
          salary: 50000,
          title: "walmart",
        },
      ],
    });
  });
  test("BadRequestError if inccorect filter is provided", async function () {
    const resp = await request(app).get(`/companies/filter`).query({
      minSoolory: 5000
    });
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: { message: "minSoolory is an Invalid Filter type", status: 400 },
    });
  });
});

// /************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  
  test("works for anon", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app).get(`/jobs/${newJob.id}`);
    expect(resp.body).toEqual({job: {id: expect.any(Number), ...newJob}});
  });


  test("not found for no such job", async function () {
    const resp = await request(app).get(`/job/1000`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  
  test("works for users", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app)
      .patch(`/jobs/${newJob.id}`)
      .send({
        title: "wally world",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: newJob.id,
      title: "wally world",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    }});
  });

  test("unauth for anon", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app).patch(`/jobs/${newJob.id}`).send({
      title: "wally world",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/10000`)
      .send({
        title: "wrong",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app)
      .patch(`/jobs/${newJob.id}`)
      .send({
        id: 1000,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app)
      .patch(`/jobs/${newJob.id}`)
      .send({
        equity: "not-equity",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app)
      .delete(`/jobs/${newJob.id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: String(newJob.id) });
  });

  test("unauth for anon", async function () {
    const newJob = await Job.create({
      title: "wally",
      salary: 50000,
      equity: "0",
      companyHandle: "c1",
    });
    const resp = await request(app).delete(`/jobs/${newJob.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/10000`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
