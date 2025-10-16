/*! Copyright 2025 Adobe
All Rights Reserved. */
import{f as i,h as o,a as u}from"./network-error.js";import{b as p}from"./updateCompanyUser.js";const c=`
  mutation createCompanyTeam($input: CompanyTeamCreateInput!) {
    createCompanyTeam(input: $input) { __typename team { id structure_id name } }
  }
`;async function E(a){const n={name:a.name,description:a.description,target_id:a.targetId};return await i(c,{variables:{input:n}}).then(e=>{var r,m,d;if((r=e.errors)!=null&&r.length)return o(e.errors);const t=(d=(m=e==null?void 0:e.data)==null?void 0:m.createCompanyTeam)==null?void 0:d.team;return t?{id:t.id,structureId:t.structure_id,name:t.name}:null}).catch(u)}const y=`
  mutation deleteCompanyTeam($id: ID!) {
    deleteCompanyTeam(id: $id) { __typename }
  }
`;async function g(a){return await i(y,{variables:{id:a}}).then(n=>{var e,t;return(e=n.errors)!=null&&e.length?o(n.errors):!!((t=n==null?void 0:n.data)!=null&&t.deleteCompanyTeam)}).catch(u)}function s(a){return a.items.map(t=>({structureId:t.entity.structure_id,parentStructureId:t.parent_id||null,label:t.entity.__typename==="CompanyTeam"?t.entity.name||"":`${t.entity.firstname||""} ${t.entity.lastname||""}`.trim(),type:t.entity.__typename==="CompanyTeam"?"team":"user",entityId:p(t.entity.id),description:t.entity.__typename==="CompanyTeam"&&t.entity.description||null})).map(t=>{const r=t.parentStructureId||null,m=!r||r==="MA=="?null:r;return{id:t.structureId,parentId:m,label:t.label,type:t.type,entityId:t.entityId,description:t.description}})}const l=a=>{if(!a)throw new Error("Invalid response: missing team data");return{id:a.id,name:a.name,description:a.description}},T=`
  query getCompanyStructure {
    company {
      structure {
        items {
          id
          parent_id
          entity {
            __typename
            ... on CompanyTeam { id structure_id name description }
            ... on Customer { id structure_id firstname lastname }
          }
        }
      }
    }
  }
`;async function A(){return await i(T,{method:"GET",cache:"no-cache"}).then(a=>{var e;if((e=a.errors)!=null&&e.length)return o(a.errors);const n=a.data.company.structure;return s(n)}).catch(u)}const C=`
  query getCompanyTeam($id: ID!) {
    company { team(id: $id) { id name description } }
  }
`;async function $(a){return await i(C,{variables:{id:a}}).then(n=>{var t,r,m;if((t=n.errors)!=null&&t.length)return o(n.errors);const e=(m=(r=n==null?void 0:n.data)==null?void 0:r.company)==null?void 0:m.team;return e?l(e):null}).catch(u)}const _=`
  mutation updateCompanyStructure($treeId: ID!, $parentTreeId: ID!) {
    updateCompanyStructure(input: { tree_id: $treeId, parent_tree_id: $parentTreeId }) {
      __typename
    }
  }
`;async function M(a){const n={treeId:a.id,parentTreeId:a.parentId};return await i(_,{variables:n}).then(e=>{var t,r;return(t=e.errors)!=null&&t.length?o(e.errors):!!((r=e==null?void 0:e.data)!=null&&r.updateCompanyStructure)}).catch(u)}const h=`
  mutation updateCompanyTeam($input: CompanyTeamUpdateInput!) {
    updateCompanyTeam(input: $input) { __typename team { id name } }
  }
`;async function S(a){const n={id:a.id,name:a.name,description:a.description};return await i(h,{variables:{input:n}}).then(e=>{var t,r,m,d;return(t=e.errors)!=null&&t.length?o(e.errors):!!((d=(m=(r=e==null?void 0:e.data)==null?void 0:r.updateCompanyTeam)==null?void 0:m.team)!=null&&d.id)}).catch(u)}export{$ as a,S as b,E as c,g as d,A as g,M as u};
//# sourceMappingURL=updateCompanyTeam.js.map
