export default {
    /**
     * Boolean dependant on if dynamic VMs are enabled
     */
    dynamic_vms_enabled: process.env.ENABLE_DYNAMIC_VMS === 'true'
}