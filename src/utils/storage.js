const STORAGE_KEY = 'student_dashboard_grades';

/**
 * Retrieve grades from local storage.
 * @returns {Array} List of grades.
 */
export const getStoredGrades = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load grades", error);
        return [];
    }
};

/**
 * Save grades to local storage.
 * @param {Array} grades 
 */
export const saveStoredGrades = (grades) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
    } catch (error) {
        console.error("Failed to save grades", error);
    }
};
