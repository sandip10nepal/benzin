const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../../public/_expo/static/js/web/entry-4b8d221cc66295620de5e15b566a32a4.js');
let content = fs.readFileSync(bundlePath, 'utf8');

const replacements = [
  // 1. ConversationalHost $o (when clicking Next:Drinks, go straight to select_drink without popup)
  {
    name: '$o in ConversationalHost',
    from: '$o=()=>{const e=!1!==yt?.settings?.dessert_reminder_enabled;if(!(0,j.isDessertInCart)(Se)&&e&&!Ze.has("dessert"))return void Xe("dessert");qe(_o?"select_drink":"review_summary")}',
    to: '$o=()=>{if(_o)return void qe("select_drink");const e=!1!==yt?.settings?.dessert_reminder_enabled;if(!(0,j.isDessertInCart)(Se)&&e&&!Ze.has("dessert"))return void Xe("dessert");qe("review_summary")}'
  },
  // 2. MenuBrowsing Je food (when clicking Next:Drinks / Explore Drinks, go straight to drinks without popup)
  {
    name: 'Je food in MenuBrowsing',
    from: "if('food'===e){const e=!1!==Y?.settings?.dessert_reminder_enabled;if(!(0,k.isDessertInCart)(O)&&e&&!ce.has('dessert'))return le('dessert'),void fe('cat_super_drinks');return Ie('cat_super_drinks'),void Me('ALL')}",
    to: "if('food'===e){return Ie('cat_super_drinks'),void Me('ALL')}"
  },
  // 3. Helper G (hookah category check using standalone regex)
  {
    name: 'Helper G',
    from: 'function G(e){return"hookah"===e.category}',
    to: 'function G(e){if(!e)return!1;if("hookah"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/HOOKAH/i.test(u)}'
  },
  // 4. Helper K (food category check using standalone regex)
  {
    name: 'Helper K',
    from: 'function K(e){return"food"===e.category}',
    to: 'function K(e){if(!e)return!1;if("food"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/FOOD|APPETIZER|VEGETARIAN|MAIN|WING|BURGER|WRAP|DESSERT/i.test(u)||(e.category_ids||[]).some(c=>/FOOD|APPETIZER|VEGETARIAN|MAIN|WING|BURGER|WRAP|DESSERT/i.test(String(c)))}'
  },
  // 5. Helper Q (drinks category check using standalone regex)
  {
    name: 'Helper Q',
    from: 'function Q(e){return"drinks"===e.category}',
    to: 'function Q(e){if(!e)return!1;if("drinks"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/DRINK|BEVERAGE|REFRESHER|TEA|COFFEE/i.test(u)||(e.category_ids||[]).some(c=>/DRINK|BEVERAGE|REFRESHER|TEA|COFFEE/i.test(String(c)))}'
  },
  // 6. Helper se
  {
    name: 'Helper se',
    from: 'function se(e){return"hookah"===e.category}',
    to: 'function se(e){if(!e)return!1;if("hookah"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/HOOKAH/i.test(u)}'
  },
  // 7. Helper ne
  {
    name: 'Helper ne',
    from: 'function ne(e){if("food"===e.category)return!0;return(e.category_ids||[]).some(re)}',
    to: 'function ne(e){if(!e)return!1;if("food"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/FOOD|APPETIZER|VEGETARIAN|MAIN|WING|BURGER|WRAP|DESSERT/i.test(u)||(e.category_ids||[]).some(c=>/FOOD|APPETIZER|VEGETARIAN|MAIN|WING|BURGER|WRAP|DESSERT/i.test(String(c)))}'
  },
  // 8. Helper le
  {
    name: 'Helper le',
    from: 'function le(e){if("drinks"===e.category)return!0;return(e.category_ids||[]).some(ie)}',
    to: 'function le(e){if(!e)return!1;if("drinks"===e.category)return!0;const u=String(e.category||"")+" "+String(e.category_id||"");return/DRINK|BEVERAGE|REFRESHER|TEA|COFFEE/i.test(u)||(e.category_ids||[]).some(c=>/DRINK|BEVERAGE|REFRESHER|TEA|COFFEE/i.test(String(c)))}'
  },
  // 9. ConversationalHost yr VibeQuestCard exclusion
  {
    name: 'yr VibeQuestCard exclusion in ConversationalHost',
    from: 'yr="select_drink"===Ne&&(0,k.jsxs)(l.default,{style:{flex:1},children:[Ct&&wt&&(0,k.jsx)(w.VibeQuestCard',
    to: 'yr="select_drink"===Ne&&(0,k.jsxs)(l.default,{style:{flex:1},children:[Ct&&wt&&"cart_drinks"!==wt.navigation_trigger&&"cart_conditional"!==wt.repeat_policy&&"q_1792449348217"!==wt.id&&!(wt.title||"").includes("Please add a drink")&&!(wt.question_text||"").includes("Please add a drink")&&(0,k.jsx)(w.VibeQuestCard'
  },
  // 10. useVibeQuest U question filter exclusion
  {
    name: 'useVibeQuest U filter exclusion',
    from: "const e=(k.questions||[]).filter(e=>!1!==e.active&&('hookah'===u?'start_order'===e.navigation_trigger||'hookah'===e.stage||'q_hookah_experience'===e.id:'food'===u?'next_food'===e.navigation_trigger||'food'===e.stage||'q_food_craving'===e.id:'drinks'===u?'next_drinks'===e.navigation_trigger||'drinks'===e.stage||'q_drink_reminder'===e.id:e.stage===u)).sort((e,t)=>(e.sort_order??0)-(t.sort_order??0));",
    to: "const e=(k.questions||[]).filter(e=>!1!==e.active&&'cart_drinks'!==e.navigation_trigger&&'cart_dessert'!==e.navigation_trigger&&'cart_conditional'!==e.repeat_policy&&'q_1792449348217'!==e.id&&!(e.title||'').includes('Please add a drink')&&!(e.question_text||'').includes('Please add a drink')&&('hookah'===u?'start_order'===e.navigation_trigger||'hookah'===e.stage||'q_hookah_experience'===e.id:'food'===u?'next_food'===e.navigation_trigger||'food'===e.stage||'q_food_craving'===e.id:'drinks'===u?'next_drinks'===e.navigation_trigger||'drinks'===e.stage:e.stage===u)).sort((e,t)=>(e.sort_order??0)-(t.sort_order??0));"
  },
  // 11. isDrinkInCart in Module 1946 (checking category string in addition to category_id)
  {
    name: 'isDrinkInCart in Module 1946',
    from: "if(t.category_id&&n.includes(t.category_id))return!0;if((t.category_ids||[]).some(t=>n.includes(t)||String(t).toUpperCase().includes('DRINK')",
    to: "if(t.category&&n.includes(t.category))return!0;if(t.category_id&&n.includes(t.category_id))return!0;if(String(t.category||'').toUpperCase().includes('DRINK')||String(t.category_id||'').toUpperCase().includes('DRINK'))return!0;if((t.category_ids||[]).some(t=>n.includes(t)||String(t).toUpperCase().includes('DRINK')"
  }
];

let allOk = true;
replacements.forEach(r => {
  const count = content.split(r.from).length - 1;
  console.log(`[${r.name}] found: ${count}`);
  if (count !== 1) allOk = false;
});

if (!allOk) {
  console.error('Some targets did not match exactly once! Aborting patch.');
  process.exit(1);
}

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(bundlePath, content, 'utf8');
console.log('Successfully patched entry bundle!');
