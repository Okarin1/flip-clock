<template>
  <div class="tick-wrapper" :style="{ '--tick-scale': scale }">
    <div class="tick-group">
      <div
        v-for="(part, index) in parts"
        :key="`part-${index}`"
        class="tick-item"
      >
        <div ref="tickRefs" class="tick">
          <div data-repeat="true" aria-hidden="true">
            <span data-view="flip"></span>
          </div>
        </div>
      </div>
    </div>
    <span v-if="subLabel" class="tick-label">{{ subLabel }}</span>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUpdated, onBeforeUnmount, nextTick } from "vue";
import Tick from "@pqina/flip";
import "@pqina/flip/dist/flip.min.css";

export default {
  name: "FlipClock",
  props: {
    parts: {
      type: Array,
      required: true
    },
    scale: {
      type: Number,
      default: 1
    },
    subLabel: {
      type: String,
      default: ""
    }
  },
  setup(props) {
    const tickRefs = ref([]);
    const ticks = ref([]);

    const syncTicks = () => {
      const refs = Array.isArray(tickRefs.value)
        ? tickRefs.value
        : tickRefs.value
        ? [tickRefs.value]
        : [];

      if (ticks.value.length === refs.length && refs.length > 0) {
        refs.forEach((el, index) => {
          if (ticks.value[index]) {
            ticks.value[index].instance.value = props.parts[index] || "";
          }
        });
        return;
      }

      if (ticks.value.length) {
        ticks.value.forEach((item) => {
          Tick.DOM.destroy(item.el);
        });
        ticks.value = [];
      }

      ticks.value = refs.map((el, index) => ({
        el,
        instance: Tick.DOM.create(el, {
          value: props.parts[index] || ""
        })
      }));
    };

    const refreshTicks = () => {
      nextTick(() => {
        syncTicks();
      });
    };

    onMounted(refreshTicks);
    onUpdated(refreshTicks);

    watch(
      () => props.parts,
      () => {
        refreshTicks();
      },
      { deep: true }
    );

    onBeforeUnmount(() => {
      if (ticks.value.length) {
        ticks.value.forEach((item) => {
          Tick.DOM.destroy(item.el);
        });
        ticks.value = [];
      }
    });

    return {
      tickRefs
    };
  }
};
</script>

<style scoped>
.tick-wrapper {
  position: relative;
  display: inline-block;
  transform: scale(var(--tick-scale, 1));
  transform-origin: center;
  max-width: 100%;
}

.tick-group {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.tick-item {
  margin-right: 1.5em;
}

.tick-item:last-child {
  margin-right: 0;
}

.tick {
  font-size: clamp(6em, 15vw, 30em);
}

::v-deep .tick-flip {
  min-width: 0.8em;
  letter-spacing: 0.1em;
  text-indent: 0.1em;
  margin-left: 0.01em;
  margin-right: 0.01em;
  transform-origin: center;
}

::v-deep .tick-flip-panel-front {
  border-bottom: 0.015em solid #000000;
}

::v-deep .tick-flip-panel-back {
  border-top: 0.015em solid #000000;
}

::v-deep .tick-flip-panel {
  font-weight: 600;
  color: #BABABA;
  background-color: #151515;
}

::v-deep .tick-flip-panel-text-wrapper {
  font-size: 1em;
  transform: scale(1.05);
  transform-origin: center;
}

.tick-label {
  position: absolute;
  left: 1.5em;
  top: 2em;
  font-size: 2em;
  font-weight: bold;
  color: #bdbdbd;
  letter-spacing: 0.1em;
  z-index: 2;
  pointer-events: none;
}

@media (max-width: 480px) {
  .tick {
    font-size: clamp(4em, 18vw, 16em);
  }

  .tick-item {
    margin-right: 0.6em;
  }

  ::v-deep .tick-flip {
    letter-spacing: 0.08em;
    text-indent: 0.08em;
  }
}
</style>
