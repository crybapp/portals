export default {
    /**
     * Boolean dependant on if dynamic VMs are enabled
     */
    dynamic_vms_enabled: process.env.ENABLE_DYNAMIC_VMS === 'true',
    /**
     * The amount of words that should be generated for a dynamic vm deployment name
     */
    dynamic_vm_word_count: parseInt(process.env.DYNAMIC_VM_NAME_WORD_COUNT || '2') || 2
}