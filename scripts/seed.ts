/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Neon Postgres Seed Script (npm run seed)
 * Manual only. Refuses to run in production unless ALLOW_SEED=true.
 */

import dotenv from 'dotenv';
import pg from 'pg';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_COURSES,
  INITIAL_PLANS,
  INITIAL_SERVICES,
} from '../src/data/seedData';

dotenv.config();

const { Pool } = pg;

// Strict Production Guard
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('====================================================================');
  console.error('REFUSED: Seed script cannot run in production (NODE_ENV=production).');
  console.error('If you explicitly intend to seed a production database, you must set:');
  console.error('ALLOW_SEED=true npm run seed');
  console.error('====================================================================');
  process.exit(1);
}

const rawConnectionString = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('DATABASE_URL_MIGRATE or DATABASE_URL is not set.');
  process.exit(1);
}

const connectionString: string = rawConnectionString;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runSeed() {
  console.log('--- Starting Avichas Metrics Neon Postgres Seed ---');
  const client = await pool.connect();

  try {
    // 1. Seed Plans
    console.log('Seeding plans...');
    for (const plan of INITIAL_PLANS) {
      await client.query(
        `INSERT INTO public.plans (
          code, name, target_audience, category, price_ngn, billing_interval,
          duration_days, credit_allowance, credit_unit_definition, features, permitted_workflows, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            price_ngn = EXCLUDED.price_ngn,
            credit_allowance = EXCLUDED.credit_allowance,
            features = EXCLUDED.features;`,
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

    // 2. Seed Services
    console.log('Seeding services...');
    for (const srv of INITIAL_SERVICES) {
      await client.query(
        `INSERT INTO public.services (
          id, index_number, slug, title, category, short_summary, business_problem,
          designed_for, what_avichas_provides, how_it_works, expected_benefits,
          implementation_process, commercial_model, starting_price_ngn, billing_cadence,
          availability_status, cta_label, cta_action, faqs
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            starting_price_ngn = EXCLUDED.starting_price_ngn,
            availability_status = EXCLUDED.availability_status,
            cta_label = EXCLUDED.cta_label,
            updated_at = now();`,
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

    // 3. Seed Courses, Modules & Lessons
    console.log('Seeding courses...');
    for (const crs of INITIAL_COURSES) {
      const { rows: courseRows } = await client.query(
        `INSERT INTO public.courses (
          slug, title, category, intended_audience, duration, instructor, instructor_role,
          price_ngn, is_free, enrolment_requirements, learning_objectives, certificate_supported, is_published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO UPDATE
        SET title = EXCLUDED.title,
            price_ngn = EXCLUDED.price_ngn
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

    // 4. Seed Blog Posts
    console.log('Seeding blog posts...');
    for (const post of INITIAL_BLOG_POSTS) {
      await client.query(
        `INSERT INTO public.blog_posts (
          slug, title, category, excerpt, content, author, author_role,
          published_at, read_time_minutes, is_featured, status, image_url, source_attribution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO UPDATE
        SET title = EXCLUDED.title,
            excerpt = EXCLUDED.excerpt,
            content = EXCLUDED.content,
            updated_at = now();`,
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

    console.log('--- Seed completed successfully ---');
    console.log('Note: Admin user accounts must be created using `npm run create-admin -- you@email.com`');
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
