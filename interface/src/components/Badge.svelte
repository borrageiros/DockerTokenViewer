<script lang="ts">
  export let text: string;
  export let color: 'danger' | 'warning' | 'success' = 'success';
  export let tooltipText: string | undefined = undefined;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'danger':
        return 'bg-danger';
      case 'warning':
        return 'bg-warning';
      case 'success':
        return 'bg-success';
      default:
        return 'bg-success';
    }
  };
</script>

<span class="badge-wrapper">
  <span class="badge rounded-pill {getColorClass(color)}">
    {text}
  </span>
  {#if tooltipText}
    <span class="tooltip-text">
      {tooltipText}
    </span>
  {/if}
</span>

<style>
  .badge-wrapper {
    position: relative;
    display: inline-block;
    margin-left: 0.5rem;
  }

  .badge {
    padding: 0.35em 0.65em;
    font-size: 0.75em;
    font-weight: 700;
    color: white;
  }

  .bg-success {
    background-color: #198754;
  }

  .bg-warning {
    background-color: #ffc107;
    color: #000;
  }

  .bg-danger {
    background-color: #dc3545;
  }

  .rounded-pill {
    border-radius: 50rem;
  }

  .tooltip-text {
    visibility: hidden;
    position: absolute;
    z-index: 1000;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    text-align: center;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    margin-right: 8px;
  }

  .badge-wrapper:hover .tooltip-text {
    visibility: visible;
  }
</style>