import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { getStoredGrades, saveStoredGrades } from '../utils/storage';

const DataSync = () => {
    const fileInputRef = useRef(null);

    // Export grades to JSON file
    const handleExport = () => {
        const grades = getStoredGrades();
        const dataStr = JSON.stringify(grades, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `notes_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Import grades from JSON file
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedGrades = JSON.parse(e.target.result);
                if (Array.isArray(importedGrades)) {
                    const existingGrades = getStoredGrades();
                    
                    // Merge: keep existing grades and add new ones
                    const mergedGrades = [...existingGrades];
                    
                    importedGrades.forEach(importedGrade => {
                        const exists = existingGrades.some(
                            g => g.ueId === importedGrade.ueId && 
                                 g.type === importedGrade.type && 
                                 g.value === importedGrade.value
                        );
                        if (!exists) {
                            mergedGrades.push(importedGrade);
                        }
                    });
                    
                    saveStoredGrades(mergedGrades);
                    alert(`Import réussi ! ${mergedGrades.length - existingGrades.length} nouvelles notes ajoutées.`);
                    window.location.reload();
                } else {
                    alert('Format de fichier invalide. Le fichier doit contenir un tableau de notes.');
                }
            } catch (error) {
                alert('Erreur lors de la lecture du fichier. Vérifiez que c\'est un fichier JSON valide.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset input to allow importing the same file again
        event.target.value = '';
    };

    return (
        <div className="flex flex-col gap-2 p-4 m-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                Synchronisation
            </p>
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors duration-200"
            >
                <Download className="w-4 h-4" />
                Exporter mes notes
            </button>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200"
            >
                <Upload className="w-4 h-4" />
                Importer des notes
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
            />
        </div>
    );
};

export default DataSync;
