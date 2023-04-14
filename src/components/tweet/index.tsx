import { component$ } from "@builder.io/qwik";

export default component$(() => {
  // <script type="module" async src="https://qwik-twitter.builder.io/tweet/1606438382561026049"></script>

//   return (
//     <>
//       {(function(html) {
//         const script = window.currentScript;
//         const div = document.createElement('div');
//         div.innerHTML = html;
//         while(div.firstChild) {
//           script.parentNode.insertBefore(div.firstChild, script);
//         });
//       })(`
//    <!-- HTML we want to insert -->
//    <div>my tweet</div>
// `)}
//     </>
//   );
  return (
    <script type="module" async src="https://qwik-twitter.builder.io/tweet/1606438382561026049"></script>
  );
});
