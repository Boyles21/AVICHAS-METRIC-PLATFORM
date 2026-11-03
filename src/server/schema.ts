/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Schema & Migration Initializer
 * Automatically ensures tables and public catalogues exist when connecting to Neon Postgres.
 */

import fs from 'fs';
import path from 'path';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_CONFIRMATIONS,
  INITIAL_COURSES,
  INITIAL_PLANS,
  INITIAL_POLICIES,
  INITIAL_SERVICES,
} from '../data/seedData';
import { isDbConfigured, pool } from './db';

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(): Promise<void> {
  if (!isDbConfigured) {
    return;
  }

  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      const client = await pool.connect();
      try {
        // 1. Ensure schema_migrations table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS public.schema_migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `);

        // 2. Read applied migrations
        const { rows: appliedRows } = await client.query(`
          SELECT name FROM public.schema_migrations ORDER BY id ASC;
        `);
        const appliedSet = new Set(appliedRows.map((r: { name: string }) => r.name));

        // 3. Scan migrations directory
        const migrationsDir = path.resolve(process.cwd(), 'migrations');
        if (fs.existsSync(migrationsDir)) {
          const files = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();

          for (const file of files) {
            if (!appliedSet.has(file)) {
              console.log(`[SCHEMA AUTO-INIT] Applying migration ${file}...`);
              const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

              await client.query('BEGIN');
              try {
                await client.query(sql);
                await client.query(
                  'INSERT INTO public.schema_migrations (name) VALUES ($1);',
                  [file]
                );
                await client.query('COMMIT');
                console.log(`[SCHEMA AUTO-INIT] Migration ${file} applied successfully.`);
              } catch (err: any) {
                await client.query('ROLLBACK');
                console.error(`[SCHEMA AUTO-INIT ERROR] Migration ${file} failed:`, err.message);
                break;
              }
            }
          }
        }

        // 4. Ensure initial catalogues are populated if empty
        try {
          await client.query("SELECT set_config('app.role', 'system', true);");
          const srvCheck = await client.query(`SELECT count(*) FROM public.services;`);
          if (Number(srvCheck.rows[0]?.count) === 0) {
            console.log('[SCHEMA AUTO-INIT] Database is unseeded. Populating public catalogues...');

            // Seed Plans
            for (const plan of INITIAL_PLANS) {
              await client.query(
                `INSERT INTO public.plans (
                  code, name, target_audience, category, price_ngn, billing_interval,
                  duration_days, credit_allowance, credit_unit_definition, features, permitted_workflows, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (code) DO NOTHING;`,
                [
                  plan.code,
                  plan.name,
                  plan.targetAudience,
                  plan.category,
                  plan.priceNgn,
                  plan.billingInterval,
                  plan.durationDays,
                  plan.creditAllowance,
                  plan.creditUnitDefinition,
                  JSON.stringify(plan.features),
                  plan.permittedWorkflows,
                  plan.active,
                ]
              );
            }

            // Seed Services
            for (const srv of INITIAL_SERVICES) {
              await client.query(
                `INSERT INTO public.services (
                  id, index_number, slug, title, category, short_summary, business_problem,
                  designed_for, what_avichas_provides, how_it_works, expected_benefits,
                  implementation_process, commercial_model, starting_price_ngn, billing_cadence,
                  availability_status, cta_label, cta_action, faqs
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                ON CONFLICT (id) DO NOTHING;`,
                [
                  srv.id,
                  srv.indexNumber,
                  srv.slug,
                  srv.title,
                  srv.category,
                  srv.shortSummary,
                  srv.businessProblem,
                  srv.designedFor,
                  srv.whatAvichasProvides,
                  srv.howItWorks,
                  JSON.stringify(srv.expectedBenefits),
                  srv.implementationProcess,
                  srv.commercialModel,
                  srv.startingPriceNgn,
                  srv.billingCadence,
                  srv.availabilityStatus,
                  srv.ctaLabel,
                  srv.ctaAction,
                  JSON.stringify(srv.faqs),
                ]
              );
            }

            // Seed Courses
            for (const crs of INITIAL_COURSES) {
              const { rows: courseRows } = await client.query(
                `INSERT INTO public.courses (
                  slug, title, category, intended_audience, duration, instructor, instructor_role,
                  price_ngn, is_free, enrolment_requirements, learning_objectives, certificate_supported, is_published
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
                RETURNING id;`,
                [
                  crs.slug,
                  crs.title,
                  crs.category,
                  crs.intendedAudience,
                  crs.duration,
                  crs.instructor,
                  crs.instructorRole,
                  crs.priceNgn,
                  crs.isFree,
                  crs.enrolmentRequirements,
                  crs.learningObjectives,
                  crs.certificateSupported,
                  crs.published,
                ]
              );

              const courseId = courseRows[0]?.id;
              if (courseId) {
                for (let mIdx = 0; mIdx < crs.modules.length; mIdx++) {
                  const mod = crs.modules[mIdx];
                  const { rows: modRows } = await client.query(
                    `INSERT INTO public.modules (course_id, title, sort_order)
                     VALUES ($1, $2, $3)
                     RETURNING id;`,
                    [courseId, mod.title, mIdx + 1]
                  );
                  const moduleId = modRows[0]?.id;
                  if (moduleId) {
                    for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
                      const les = mod.lessons[lIdx];
                      await client.query(
                        `INSERT INTO public.lessons (
                          module_id, title, duration_minutes, format, summary, resource_name, sort_order
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
                        [
                          moduleId,
                          les.title,
                          les.durationMinutes,
                          les.format,
                          les.summary,
                          les.resourceName,
                          lIdx + 1,
                        ]
                      );
                    }
                  }
                }
              }
            }

            // Seed Blog Posts
            for (const post of INITIAL_BLOG_POSTS) {
              await client.query(
                `INSERT INTO public.blog_posts (
                  slug, title, category, excerpt, content, author, author_role,
                  published_at, read_time_minutes, is_featured, status, image_url, source_attribution
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (slug) DO NOTHING;`,
                [
                  post.slug,
                  post.title,
                  post.category,
                  post.excerpt,
                  post.content,
                  post.author,
                  post.authorRole,
                  post.publishedAt,
                  post.readTimeMinutes,
                  post.featured,
                  post.status,
                  post.imageUrl,
                  post.sourceAttribution ? JSON.stringify(post.sourceAttribution) : null,
                ]
              );
            }

            console.log('[SCHEMA AUTO-INIT] Services, plans, courses and blog posts successfully populated.');
          }

          // Ensure policies populated if empty
          const polCheck = await client.query(`SELECT count(*) FROM public.policies;`);
          if (Number(polCheck.rows[0]?.count) === 0) {
            console.log('[SCHEMA AUTO-INIT] Populating legal policies in PostgreSQL...');
            for (const pol of INITIAL_POLICIES) {
              await client.query(
                `INSERT INTO public.policies (
                  id, slug, title, short_title, last_updated, counsel_approval_status,
                  regulatory_framework, summary, sections
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING;`,
                [
                  pol.id,
                  pol.slug,
                  pol.title,
                  pol.shortTitle,
                  pol.lastUpdated,
                  pol.counselApprovalStatus,
                  pol.regulatoryFramework,
                  pol.summary,
                  JSON.stringify(pol.sections),
                ]
              );
            }
          }

          // Ensure pre-launch confirmations populated if empty
          const confCheck = await client.query(`SELECT count(*) FROM public.pre_launch_confirmations;`);
          if (Number(confCheck.rows[0]?.count) === 0) {
            console.log('[SCHEMA AUTO-INIT] Populating pre-launch confirmations in PostgreSQL...');
            for (const conf of INITIAL_CONFIRMATIONS) {
              await client.query(
                `INSERT INTO public.pre_launch_confirmations (
                  id, item, part_reference, required_decision_evidence, current_resolution_notes, status, owner
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO NOTHING;`,
                [
                  conf.id,
                  conf.item,
                  conf.partReference,
                  conf.requiredDecisionEvidence,
                  conf.currentResolutionNotes,
                  conf.status,
                  conf.owner,
                ]
              );
            }
          }
        } catch (seedErr: any) {
          console.warn('[SCHEMA AUTO-INIT] Seeding skipped or deferred:', seedErr.message);
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[SCHEMA AUTO-INIT] Auto-migration check deferred:', err.message);
    }
  })();

  return migrationPromise;
}
