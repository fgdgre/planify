<template>
  <section id="product" class="mx-auto max-w-[1260px] scroll-mt-20 border-t border-border px-5 py-16 tablet:px-10 tablet:py-[120px]">
    <div class="mx-auto max-w-[680px] text-center">
      <span class="text-[13px] font-semibold text-primary-deep">The problem</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">Your week lives in three places at once</h2>
      <p class="text-base leading-[1.55] text-placeholder">If you work with more than one client, this probably sounds familiar.</p>
    </div>

    <div class="mt-12 grid gap-[18px] tablet:grid-cols-3">
      <div class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="flex gap-1 px-2.5 pt-2.5">
            <span class="flex-1 rounded-t-[7px] bg-white px-2 py-1.5 text-[10px] text-foreground shadow-[inset_0_-1px_0_var(--border)]">acme.com</span>
            <span class="flex-1 rounded-t-[7px] bg-zinc-200 px-2 py-1.5 text-[10px] text-placeholder">studio.io</span>
            <span class="flex-1 rounded-t-[7px] bg-zinc-200 px-2 py-1.5 text-[10px] text-placeholder">gmail</span>
          </div>
          <div class="relative mx-2.5 h-[62px] rounded-b-lg bg-white">
            <i class="absolute top-3.5 right-[40%] left-2.5 h-4 rounded bg-[#f9d3d4]" />
          </div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">Tab roulette</h3>
        <p class="text-sm leading-[1.55] text-placeholder">Three Google accounts, three browser tabs. You check all of them before you can say yes to a call.</p>
      </div>

      <div class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="absolute inset-x-3.5 top-11 h-9 rounded-lg border border-dashed border-zinc-300">
            <span class="absolute -top-5 left-0 text-[10px] text-placeholder">2:00 pm</span>
          </div>
          <div class="absolute top-[46px] left-4 h-8 w-[44%] rounded-[7px] border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-2.5 py-2 text-[11px] font-medium text-[#b4232a]">Acme demo</div>
          <div class="absolute top-[46px] right-4 h-8 w-[44%] rounded-[7px] border-l-[3px] border-[#30a46c] bg-[#e6f5ee] px-2.5 py-2 text-[11px] font-medium text-[#1d7a4d]">Studio QA</div>
          <div class="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#f6c5c7] bg-white px-2 py-[3px] text-[10px] font-semibold whitespace-nowrap text-[#b4232a]">⚠ Same time, two calendars</div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">The silent double-booking</h3>
        <p class="text-sm leading-[1.55] text-placeholder">Client A takes 2pm in their calendar. Client B takes 2pm in theirs. Neither calendar knows about the other.</p>
      </div>

      <div class="relative overflow-hidden rounded-[18px] border border-border bg-white p-6">
        <div class="relative h-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          <div class="absolute top-3.5 left-3 -translate-x-2 translate-y-1.5 -rotate-[8deg] rounded-md border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]">📄 Doc: "Acme v2 scope"</div>
          <div class="absolute top-10 right-3 translate-x-2.5 -translate-y-1 rotate-6 rounded-md border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]">💬 Slack: "ship in May?"</div>
          <div class="absolute top-[74px] left-10 -translate-x-1 translate-y-2 -rotate-3 rounded-md border border-border bg-white px-2 py-1.5 text-[10px] shadow-[0_4px_10px_-6px_rgba(0,0,0,0.2)]">📧 Email thread (14)</div>
        </div>
        <h3 class="mt-4 mb-1.5 text-lg font-semibold tracking-[-0.035em]">Notes in the wrong place</h3>
        <p class="text-sm leading-[1.55] text-placeholder">What you agreed on Tuesday is in a Doc, a Slack DM, or nowhere at all. Never next to the meeting.</p>
      </div>
    </div>
  </section>
</template>
