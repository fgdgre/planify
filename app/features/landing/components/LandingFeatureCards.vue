<template>
  <section class="mx-auto max-w-[1260px] px-5 pt-5 pb-16 tablet:px-10 tablet:pb-[120px]">
    <div class="mx-auto max-w-[680px] text-center">
      <span class="text-[13px] font-semibold text-primary-deep">How Planify helps</span>
      <h2 class="mt-2.5 mb-3.5 text-3xl leading-[1.08] font-semibold tracking-[-0.035em] tablet:text-5xl">
        One grid. Every account.<br>
        <em class="bg-linear-to-r from-primary-deep to-primary bg-clip-text text-transparent not-italic">Context inside.</em>
      </h2>
    </div>

    <div class="mt-11 grid gap-[18px] tablet:grid-cols-[1.2fr_1fr]">
      <div class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Every account on one grid</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Connect up to three Google accounts. Each gets its own color.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="grid grid-cols-[28px_repeat(5,1fr)] text-[10px]">
            <div />
            <div class="py-1.5 text-center text-placeholder">Mon</div>
            <div class="py-1.5 text-center text-placeholder">Tue</div>
            <div class="py-1.5 text-center text-placeholder">Wed</div>
            <div class="py-1.5 text-center text-placeholder">Thu</div>
            <div class="py-1.5 text-center text-placeholder">Fri</div>

            <div class="h-11 border-t border-zinc-100 px-1 py-[3px] text-zinc-400">9</div>
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-20 overflow-hidden rounded-md border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#b4232a]">Acme standup</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-2 z-10 h-[52px] overflow-hidden rounded-md border-l-[3px] border-[#30a46c] bg-[#e6f5ee] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#1d7a4d]">Studio review</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-9 overflow-hidden rounded-md border-l-[3px] border-[#e5484d] bg-[#fdeaea] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#b4232a]">Acme sync</div>
            </div>

            <div class="h-11 border-t border-zinc-100 px-1 py-[3px] text-zinc-400">10</div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-[3px] z-10 h-20 overflow-hidden rounded-md border-l-[3px] border-[#3e7bfa] bg-[#e8effe] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-[#2357c4]">Dentist</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
            <div class="relative h-11 border-t border-l border-zinc-100">
              <div class="absolute inset-x-1 top-1.5 z-10 h-[72px] overflow-hidden rounded-md border-l-[3px] border-primary bg-[#eae7f7] px-[7px] py-[5px] text-[10px] leading-tight font-medium text-primary-deep">Deep work</div>
            </div>
            <div class="h-11 border-t border-l border-zinc-100" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Notes inside the meeting</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Attach notes to any event. Next week, the context is right there.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="px-3.5 py-3">
            <span class="rounded bg-[#fde4e5] px-[7px] py-[3px] text-[10px] text-[#b4232a]">acme.com</span>
            <div class="mt-2 text-sm font-semibold">Acme standup</div>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <div>
              <b>Scope for v2</b>
              <div class="mt-0.5 text-placeholder">Ship onboarding first, pricing in May.</div>
            </div>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5 font-semibold text-primary-deep">+ Add note</div>
        </div>
      </div>

      <div class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">Search every calendar</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">One box over all accounts. Find the last Acme call in two seconds.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="px-3.5 py-2.5">🔍 <b>acme</b></div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <span class="inline-block size-2 rounded-xs bg-[#e5484d]" />
            <span class="flex-1">Acme standup</span>
            <span class="text-placeholder">Mon</span>
          </div>
          <div class="flex items-center gap-2 border-t border-zinc-100 px-3.5 py-2.5">
            <span class="inline-block size-2 rounded-xs bg-[#e5484d]" />
            <span class="flex-1">Acme demo</span>
            <span class="text-placeholder">Thu</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-[18px] overflow-hidden rounded-[22px] bg-primary-soft p-7">
        <div>
          <h3 class="text-[22px] font-semibold tracking-[-0.025em]">See where your week went</h3>
          <p class="mt-1.5 text-sm leading-[1.5] text-placeholder">Hours by calendar, so you know which client eats your time.</p>
        </div>
        <div class="overflow-hidden rounded-xl border border-[#ece9f7] bg-white text-xs shadow-[0_10px_30px_-12px_rgba(111,95,184,0.35)]">
          <div class="flex h-[110px] items-end gap-3 px-4 pt-4 pb-2.5">
            <div class="flex h-[70%] flex-1 flex-col-reverse overflow-hidden rounded-t-[5px]">
              <span class="block h-1/2 bg-[#e5484d]" />
              <span class="block h-[30%] bg-[#30a46c]" />
              <span class="block h-1/5 bg-[#3e7bfa]" />
            </div>
            <div class="flex h-[92%] flex-1 flex-col-reverse overflow-hidden rounded-t-[5px]">
              <span class="block h-[60%] bg-[#e5484d]" />
              <span class="block h-[40%] bg-[#30a46c]" />
            </div>
            <div class="flex h-[55%] flex-1 flex-col-reverse overflow-hidden rounded-t-[5px]">
              <span class="block h-1/2 bg-[#30a46c]" />
              <span class="block h-1/2 bg-[#3e7bfa]" />
            </div>
            <div class="flex h-[80%] flex-1 flex-col-reverse overflow-hidden rounded-t-[5px]">
              <span class="block h-1/2 bg-primary" />
              <span class="block h-1/2 bg-[#e5484d]" />
            </div>
            <div class="flex h-[40%] flex-1 flex-col-reverse overflow-hidden rounded-t-[5px]">
              <span class="block h-[60%] bg-[#30a46c]" />
              <span class="block h-[40%] bg-[#3e7bfa]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
