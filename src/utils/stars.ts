/**
 * Calculates the total number of stars and the corresponding star color based on the class statistics.
 *
 * @param {ClassStat[]} classStats - An array of class statistics.
 * @returns {StarInfoUIModel} An object containing the total number of stars and the corresponding star color.
 *
 * @remarks
 * - If `classStats` is not an array or is null/undefined, the function returns an object with 0 stars and the default color.
 * - The number of stars is calculated based on the `BestBaseFame` of each class stat.
 * - The star color is determined by dividing the total number of stars by the number of classes and mapping it to the `STARCOLOR` array.
 */
import { StarInfoUIModel } from '@api/models/account-ui-model';
import { ClassStat } from '@realm/models/charlist-response';

const NUMCLASSES = 18;
const STARFAME = [20, 500, 1500, 5000, 15000];
const STARCOLOR = ['#8a98de', '#314ddb', '#c1272d', '#f7931e', '#ffff00', '#ffffff'];
const DEFAULTCOLOR = '#8a98de';

export function calculateStars(classStats: ClassStat[]): StarInfoUIModel {
  if (!Array.isArray(classStats)) {
    return { stars: 0, color: DEFAULTCOLOR };
  }
  if (!classStats) return { stars: 0, color: DEFAULTCOLOR };

  let totalStars: number = 0;
  let starCount: number = 0;

  for (const stat of classStats) {
    const bestBaseFame: number = parseInt(stat.BestBaseFame ?? '0');

    for (let i = 0; i < STARFAME.length && bestBaseFame >= STARFAME[i]; i++) {
      starCount++;
    }

    totalStars += starCount;
  }

  const starColor = STARCOLOR[Math.floor(starCount / NUMCLASSES)] || DEFAULTCOLOR;

  return {
    stars: starCount,
    color: starColor
  };
}
