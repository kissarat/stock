CREATE VIEW own AS
  SELECT
    code,
    sum(amount) AS amount
  FROM wallet
  GROUP BY code;
