CREATE VIEW balance AS
  SELECT
    user,
    sum(price * amount) AS balance
  FROM own
  GROUP BY user;

CREATE VIEW profile AS
  SELECT
    id,
    forename,
    surename,
    balance
  FROM balance b
    JOIN user u ON b.user = u.id;

CREATE VIEW own AS
  SELECT
    code,
    sum(amount) AS amount
  FROM stock
  GROUP BY code;
