/**
 * Calculate the weighted average for a specific UE (Subject).
 * @param {Array} grades - List of grades for this UE.
 * @returns {number|null} - Weighted average or null if no grades.
 */
export const calculateUEAverage = (grades) => {
    if (!grades || grades.length === 0) return null;

    const totalScore = grades.reduce((acc, grade) => acc + (grade.value * grade.coef), 0);
    const totalCoef = grades.reduce((acc, grade) => acc + grade.coef, 0);

    return totalCoef === 0 ? 0 : parseFloat((totalScore / totalCoef).toFixed(2));
};

/**
 * Calculate the Global Average (Moyenne Générale).
 * @param {Array} allGrades - List of all grades.
 * @param {Array} ues - List of UE definitions with their coefficients.
 * @returns {number|null} - Global weighted average.
 */
export const calculateGlobalAverage = (allGrades, ues) => {
    if (!ues || ues.length === 0) return null;

    let totalPoints = 0;
    let totalUECoef = 0;

    ues.forEach(ue => {
        const ueGrades = allGrades.filter(g => g.ue_id === ue.id);
        const ueAvg = calculateUEAverage(ueGrades);

        if (ueAvg !== null) {
            totalPoints += ueAvg * ue.coef_ue;
            totalUECoef += ue.coef_ue;
        }
    });

    return totalUECoef === 0 ? null : parseFloat((totalPoints / totalUECoef).toFixed(2));
};

/**
 * Get statistics per UE.
 * @param {Array} allGrades 
 * @param {Array} ues 
 * @returns {Array} - List of UEs with their calculated averages.
 */
export const getUEStatistics = (allGrades, ues) => {
    return ues.map(ue => {
        const ueGrades = allGrades.filter(g => g.ue_id === ue.id);
        const average = calculateUEAverage(ueGrades);
        return {
            ...ue,
            average,
            gradeCount: ueGrades.length
        };
    });
};
