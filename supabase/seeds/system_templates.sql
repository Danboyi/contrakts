with t as (
  insert into contract_templates
    (title, description, industry, currency, terms, is_system, is_public)
  values (
    'Brand identity project',
    'Logo, brand guidelines, colour palette, and typography system for a new or rebranded company.',
    'creative', 'USD',
    'Scope of work is limited to deliverables specified in the milestones above. All revisions beyond those noted per milestone will be quoted separately. Intellectual property transfers fully to the client upon final payment. The vendor retains the right to display completed work in their portfolio unless otherwise agreed in writing. Communication will occur exclusively on the Contrakts platform.',
    true, true
  )
  returning id
)
insert into template_milestones
  (template_id, order_index, title, description, amount_hint)
select
  t.id,
  ms.order_index,
  ms.title,
  ms.description,
  ms.amount_hint
from t,
(values
  (0, 'Discovery & strategy', 'Brand audit, competitor analysis, positioning workshop, and creative direction document.', 1500),
  (1, 'Logo concepts', '3 initial logo concepts with rationale. Client selects one direction for development.', 2000),
  (2, 'Logo refinement', 'Up to 2 rounds of revisions on chosen concept. Final logo in all required formats.', 1000),
  (3, 'Brand guidelines', 'Full brand guidelines document: colours, typography, usage rules, and examples.', 1500)
) as ms(order_index, title, description, amount_hint);

with t as (
  insert into contract_templates
    (title, description, industry, currency, terms, is_system, is_public)
  values (
    'Software MVP development',
    'End-to-end development of a minimum viable product, from design to deployment.',
    'software', 'USD',
    'All code deliverables will be original work free of third-party license conflicts unless explicitly disclosed. Source code and all related assets transfer to the client upon full payment. The vendor provides bug fixes for 30 days after final milestone approval at no additional cost. Scope changes after contract signing require a written amendment. Communication and file delivery occur exclusively on the Contrakts platform.',
    true, true
  )
  returning id
)
insert into template_milestones
  (template_id, order_index, title, description, amount_hint)
select
  t.id,
  ms.order_index,
  ms.title,
  ms.description,
  ms.amount_hint
from t,
(values
  (0, 'Discovery & architecture', 'Requirements gathering, technical architecture document, database schema, and project plan.', 2000),
  (1, 'UI/UX design', 'Wireframes and high-fidelity mockups for all core screens. Design system included.', 3000),
  (2, 'Core development', 'Backend API and frontend implementation of all MVP features.', 8000),
  (3, 'Testing & QA', 'Unit tests, integration tests, bug fixes, and performance review.', 2000),
  (4, 'Deployment & handover', 'Production deployment, CI/CD setup, documentation, and 30-day support window.', 1500)
) as ms(order_index, title, description, amount_hint);

with t as (
  insert into contract_templates
    (title, description, industry, currency, terms, is_system, is_public)
  values (
    'Interior renovation',
    'Full interior renovation including design, demolition, construction, and finishing.',
    'construction', 'USD',
    'All work will comply with applicable local building codes and regulations. Materials will meet or exceed specifications agreed upon at contract signing. The vendor carries full liability insurance. Any scope changes require written amendment before work proceeds. Site access must be provided as agreed. Delays caused by client unavailability do not constitute vendor breach. Communication and delivery documentation occur exclusively on the Contrakts platform.',
    true, true
  )
  returning id
)
insert into template_milestones
  (template_id, order_index, title, description, amount_hint)
select
  t.id,
  ms.order_index,
  ms.title,
  ms.description,
  ms.amount_hint
from t,
(values
  (0, 'Design & planning', 'Site assessment, design drawings, material specification, and project timeline.', 2500),
  (1, 'Demolition & preparation', 'Removal of existing fixtures, surface preparation, and structural work.', 5000),
  (2, 'Electrical & plumbing', 'All electrical, plumbing, and mechanical rough-in work.', 6000),
  (3, 'Finishing & fit-out', 'Walls, floors, ceilings, fixtures, and all finish work.', 8000),
  (4, 'Final inspection & handover', 'Snagging list completion, final clean, documentation, and key handover.', 2000)
) as ms(order_index, title, description, amount_hint);

with t as (
  insert into contract_templates
    (title, description, industry, currency, terms, is_system, is_public)
  values (
    'Business consulting engagement',
    'Strategic advisory engagement with defined deliverables and review checkpoints.',
    'consulting', 'USD',
    'Services are advisory in nature. The vendor will provide deliverables as described in each milestone. The client is responsible for implementation decisions based on advice received. All information shared by either party is confidential. The vendor may not engage competing clients in the same specific domain during the contract period without written consent. Communication occurs exclusively on the Contrakts platform.',
    true, true
  )
  returning id
)
insert into template_milestones
  (template_id, order_index, title, description, amount_hint)
select
  t.id,
  ms.order_index,
  ms.title,
  ms.description,
  ms.amount_hint
from t,
(values
  (0, 'Diagnostic & discovery', 'Stakeholder interviews, data review, and situation analysis report.', 3000),
  (1, 'Strategy development', 'Strategic options analysis, recommendation framework, and presentation.', 4000),
  (2, 'Implementation roadmap', 'Detailed execution plan with timelines, KPIs, and resource requirements.', 2500),
  (3, 'Review & handover', 'Final review session, documentation package, and 30-day Q&A support.', 1500)
) as ms(order_index, title, description, amount_hint);

with t as (
  insert into contract_templates
    (title, description, industry, currency, terms, is_system, is_public)
  values (
    'Event production',
    'End-to-end event management from concept to post-event reporting.',
    'events', 'USD',
    'The vendor is responsible for coordination of all agreed deliverables. Client is responsible for timely decisions on approvals. Force majeure events are outside vendor liability. All vendor fees, deposits, and third-party costs are included in milestones unless explicitly excluded. Communication occurs exclusively on the Contrakts platform.',
    true, true
  )
  returning id
)
insert into template_milestones
  (template_id, order_index, title, description, amount_hint)
select
  t.id,
  ms.order_index,
  ms.title,
  ms.description,
  ms.amount_hint
from t,
(values
  (0, 'Concept & planning', 'Event concept document, venue shortlist, vendor recommendations, and budget breakdown.', 2000),
  (1, 'Vendor & venue booking', 'Confirmed venue, caterer, AV, and all third-party bookings.', 3000),
  (2, 'Production & logistics', 'Run-of-show, staffing, equipment delivery, and rehearsal.', 4000),
  (3, 'Event execution', 'Full on-site management and coordination on the event day.', 3000),
  (4, 'Post-event reporting', 'Attendance report, vendor debrief, photo and video delivery, and expense reconciliation.', 1000)
) as ms(order_index, title, description, amount_hint);
