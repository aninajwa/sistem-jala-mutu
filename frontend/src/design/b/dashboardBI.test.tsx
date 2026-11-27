// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DashboardPage from '../../pages/DashboardPage';
import { createBIDemoFixture } from '../../pages/biDemoFixture';
import { WORKFLOW_ROLE_OPTIONS } from '../../workflow/workflowConfig';
import type { PageProps } from '../../types';
vi.mock('./geo/DirectorateMap',()=>({DirectorateMap:()=> <div aria-label="Peta Indonesia"/>}));
afterEach(cleanup);
for(const role of WORKFLOW_ROLE_OPTIONS)it(`${role}: fixture BI terisolasi dan tidak mengubah paket`,()=>{
 const f=createBIDemoFixture(role);const before=JSON.stringify(f.packages);
 const p:PageProps={workflow:f.workflow,packages:f.packages,biVolumes:f.volumes,biGeography:f.geography,store:{surveys:[],findings:[],docs:[],logs:[]},openPackage:vi.fn(),openPackageReview:vi.fn(),openPackageBA:vi.fn(),balai:'Semua Balai',periode:'Semua periode',jenis:'Semua',scoped:[],search:'',setSearch:vi.fn(),activeTab:'Semua',setActiveTab:vi.fn(),openNew:vi.fn(),beginEdit:vi.fn(),updateStatus:vi.fn(),record:vi.fn(),setNotice:vi.fn()};
 render(<DashboardPage {...p}/>);expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);expect(document.querySelectorAll('.b-metrics > .b-metric')).toHaveLength(4);expect(document.querySelectorAll('.b-metrics button, .b-metrics a, .b-metrics summary, .b-metrics [role=button], .bi-kpi-detail')).toHaveLength(0);expect(JSON.stringify(f.packages)).toBe(before);expect(f.volumes.every(r=>r.packageId in f.packages)).toBe(true);
});
