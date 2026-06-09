import { useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import allUEs from '../../../config_ue.json';

/**
 * Hook qui retourne les UEs uniquement si le profil utilisateur correspond
 * à une filière/année dont les UEs sont configurées dans la base.
 * 
 * Actuellement, seule la config DaMS 3A existe.
 * Pour ajouter d'autres filières, il suffira de créer des fichiers
 * config_ue_FILIERE_ANNEE.json et les charger ici.
 */
const UE_CONFIGS = {
    'DaMS_3A': allUEs,
};

export const useUEConfig = () => {
    const { filiere, annee } = useSchedule();

    const ues = useMemo(() => {
        const key = `${filiere}_${annee}`;
        return UE_CONFIGS[key] || [];
    }, [filiere, annee]);

    const hasUEConfig = ues.length > 0;

    return { ues, hasUEConfig };
};
