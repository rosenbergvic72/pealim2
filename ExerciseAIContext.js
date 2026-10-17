import React, { createContext, useContext } from 'react';
const ExerciseAIContext = createContext({ startVisible: false, setStartVisible: () => {} });
export const ExerciseAIProvider = ExerciseAIContext.Provider;
export const useExerciseAI = () => useContext(ExerciseAIContext);
