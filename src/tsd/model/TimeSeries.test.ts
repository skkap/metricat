import { TimeSeries } from './TimeSeries';

test("findTimeIndexRight", () => {
  const ts = new TimeSeries(
    [1, 2, 3, 4],
    [new Date(2015, 1, 1), new Date(2015, 1, 2), new Date(2015, 1, 3), new Date(2015, 1, 4)]
  );

  expect(ts.findTimeIndexRight(new Date(2015, 1, 1))).toBe(1);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 2))).toBe(2);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 3))).toBe(3);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 4))).toBe(3);

  expect(ts.findTimeIndexRight(new Date(2014, 1, 1))).toBe(1);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 1, 1))).toBe(1);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 2, 1))).toBe(2);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 3, 1))).toBe(3);
  expect(ts.findTimeIndexRight(new Date(2015, 1, 4, 1))).toBe(3);
});

test("findTimeIndexLeft", () => {
  const ts = new TimeSeries(
    [1, 2, 3, 4],
    [new Date(2015, 1, 1), new Date(2015, 1, 2), new Date(2015, 1, 3), new Date(2015, 1, 4)]
  );

  expect(ts.findTimeIndexLeft(new Date(2015, 1, 1))).toBe(0);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 2))).toBe(0);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 3))).toBe(1);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 4))).toBe(2);

  expect(ts.findTimeIndexLeft(new Date(2014, 1, 1))).toBe(0);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 1, 1))).toBe(0);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 2, 1))).toBe(1);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 3, 1))).toBe(2);
  expect(ts.findTimeIndexLeft(new Date(2015, 1, 4, 1))).toBe(2);
});
