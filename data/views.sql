CREATE VIEW balance AS
  SELECT
    user,
    sum(price * amount) AS balance
  FROM stock
  GROUP BY user;

CREATE VIEW profile AS
  SELECT
    id,
    forename,
    surname,
    password,
    balance
  FROM user u
    LEFT JOIN balance b ON b.user = u.id;

CREATE VIEW own AS
  SELECT
    code,
    sum(amount) AS amount
  FROM stock
  GROUP BY code;
