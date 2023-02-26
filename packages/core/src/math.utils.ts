export function getAverage(arr: number[]): number {
  let sum = 0;
  arr.forEach(elem => {
    sum += elem;
  });
  const avg = sum / arr.length;

  return avg || 0;
}
export function getWeightedMean(values: number[], weights: number[]): number {
  const result = values
    .map((value, i) => {
      const weight = weights[i];
      const sum = value * weight;

      return [sum, weight];
    })
    .reduce((p, c) => [p[0] + c[0], p[1] + c[1]], [0, 0]);

  return result[0] / result[1];
}

export function sumArrayValues(arr: number[]): number {
  return arr.reduce((acc, value) => value + acc, 0);
}
