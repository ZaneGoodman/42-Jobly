const { sqlForPartialUpdate } = require("./sql");

const dataToUpdate = {
  firstName: "zane",
  lastName: "goodman",
  password: "bob123",
  email: "z@gmail.com",
  isAdmin: false,
};
const jsToSql = {
  firstName: "first_name",
  lastName: "last_name",
  isAdmin: "is_admin",
};

describe("Testing sqlForPartialUpdate helper function", function () {
  test("Test that the passed in data is retuned in SQL format", async () => {
    const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(res.values).toContain("zane");
    expect(res.setCols).toContain(`"first_name"=$1`);
    expect(res.setCols).not.toContain("firstName");
    expect(res).toEqual({
      setCols: `"first_name"=$1, "last_name"=$2, "password"=$3, "email"=$4, "is_admin"=$5`,
      values: ["zane", "goodman", "bob123", "z@gmail.com", false],
    });
  });
});
