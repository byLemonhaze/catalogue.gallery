import { defineField, defineType } from 'sanity';
const imageFields = [defineField({name:'alt',type:'string',title:'Alternative text',validation:Rule=>Rule.required()}),defineField({name:'credit',type:'string',title:'Image credit'}),defineField({name:'sourceUrl',type:'url',title:'Image source',validation:Rule=>Rule.uri({scheme:['https','http']})})];
export default defineType({
    name:'dispatch', title:'DISPATCH', type:'document',
    description:'Approve the edition, publish here, verify the live page, then publish the approved X post.',
    fields:[
        defineField({name:'title',type:'string',validation:Rule=>Rule.required()}),
        defineField({name:'issueDate',type:'date',validation:Rule=>Rule.required()}),
        defineField({name:'slug',type:'slug',options:{source:'issueDate'},description:'Use YYYY-MM-DD.',validation:Rule=>Rule.required().custom(value=>!value?.current || /^\d{4}-\d{2}-\d{2}$/.test(value.current) || 'Use YYYY-MM-DD.')}),
        defineField({name:'dateDisplay',type:'string',description:'For example Wed, Nov 11, 2026',validation:Rule=>Rule.required()}),
        defineField({name:'dek',title:'Short summary',type:'text',rows:2}),
        defineField({name:'publishedAt',type:'datetime',description:'Only published documents whose publication time has passed appear on the site.',validation:Rule=>Rule.required()}),
        defineField({name:'cover',type:'image',fields:imageFields,validation:Rule=>Rule.required()}),
        defineField({name:'items',type:'array',validation:Rule=>Rule.required().min(1).custom(items=>!items || new Set(items.map(item=>(item as {number:number}).number)).size===items.length || 'Story numbers must be unique.'),of:[{type:'object',name:'dispatchItem',fields:[
            defineField({name:'number',type:'number',validation:Rule=>Rule.required().integer().min(1)}),
            defineField({name:'headline',type:'string',validation:Rule=>Rule.required()}),
            defineField({name:'body',type:'text',rows:8}),
            defineField({name:'sources',type:'array',of:[{type:'object',fields:[defineField({name:'label',type:'string',validation:Rule=>Rule.required()}),defineField({name:'url',type:'url',validation:Rule=>Rule.required().uri({scheme:['https','http']})})]}]}),
            defineField({name:'handles',type:'array',of:[{type:'string'}]}),
            defineField({name:'plate',type:'image',fields:imageFields}),
            defineField({name:'artists',type:'array',of:[{type:'reference',to:[{type:'artist'},{type:'gallery'}],options:{filter:'!(_id in path("drafts.**"))'}}]}),
            defineField({name:'relatedPosts',type:'array',of:[{type:'reference',to:[{type:'post'}],options:{filter:'!(_id in path("drafts.**"))'}}]}),
        ],preview:{select:{title:'headline',subtitle:'number'}}}]}),
        defineField({name:'plates',title:'Archived highlight plates',type:'array',description:'Use when the original publication does not identify the associated story. For new editions attach each plate to its story.',of:[{type:'image',fields:imageFields}]}),
        defineField({name:'body',title:'Original publication text',type:'text',rows:12,description:'Preserved verbatim for archive provenance.'}),
        defineField({name:'archiveSource',type:'string',hidden:true}),
        defineField({name:'xPostUrl',type:'url',description:'Add only after the approved issue is live and the X post has been published.',validation:Rule=>Rule.uri({scheme:['https']}).custom(value=>!value || /^https:\/\/(www\.)?(x\.com|twitter\.com)\//.test(value) || 'Use the published X post URL.')}),
    ],
    orderings:[{title:'Newest edition',name:'issueDateDesc',by:[{field:'issueDate',direction:'desc'}]}],
    preview:{select:{title:'title',subtitle:'issueDate',media:'cover'}},
});
