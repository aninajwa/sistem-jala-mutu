import {useEffect,useMemo,useState} from 'react';
import type {OperationalWorkflowState} from '../workflow/model';
import {SOURCE_FORM_CHANGED,workflowFormIssues} from '../workflow/repository/workflowReconciliation';
export function useWorkflowReconciliation(state:OperationalWorkflowState){const [revision,setRevision]=useState(0);useEffect(()=>{const changed=()=>setRevision(value=>value+1);window.addEventListener(SOURCE_FORM_CHANGED,changed);return()=>window.removeEventListener(SOURCE_FORM_CHANGED,changed);},[]);return useMemo(()=>workflowFormIssues(state),[state,revision]);}
