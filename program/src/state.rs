use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use std::convert::TryInto;
#[derive(Debug, PartialEq)]
pub struct VestingSchedule {
    pub release_time: u64,
    pub amount: u64,
    pub is_released: bool,
}

#[derive(Debug, PartialEq)]
pub struct VestingScheduleHeader {
    pub seeds: [u8; 32],
    pub destination_address: Pubkey,
    pub mint_address: Pubkey,
    pub total_amount: u64,
    pub created_date: i64, 
    pub is_initialized: bool,
}

impl Sealed for VestingScheduleHeader {}

impl Pack for VestingScheduleHeader {
    const LEN: usize = 113;

    fn pack_into_slice(&self, target: &mut [u8]) {
        let destination_address_bytes = self.destination_address.to_bytes();
        let mint_address_bytes = self.mint_address.to_bytes();
        let total_amount_bytes = self.total_amount.to_le_bytes();
        let created_date = self.created_date.to_le_bytes();

        for i in 0..32 {
            target[i] = self.seeds[i];
        }

        for i in 32..64 {
            target[i] = destination_address_bytes[i - 32];
        }

        for i in 64..96 {
            target[i] = mint_address_bytes[i - 64];
        }

        for i in 96..104 {
            target[i] = total_amount_bytes[i - 96];
        }

        for i in 104..112 {
            target[i] = created_date[i - 104];
        }

        target[112] = self.is_initialized as u8;
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < VestingScheduleHeader::LEN {
            return Err(ProgramError::InvalidAccountData);
        }

        let seeds = arrayref::array_ref!(&src[..32], 0, 32);
        let destination_address = Pubkey::from(arrayref::array_ref!(&src[32..64], 0, 32).clone());
        let mint_address = Pubkey::from(arrayref::array_ref!(&src[64..96], 0, 32).clone());
        let total_amount = u64::from_le_bytes(arrayref::array_ref!(&src[96..104], 0, 8).clone());    
        let created_date = i64::from_le_bytes(src[104..112].try_into().unwrap());
        let is_initialized = src[112] == 1;

        Ok(Self {
            seeds: seeds.clone(),
            destination_address,
            mint_address,
            is_initialized,
            created_date,
            total_amount,
        })
    }
}

impl Sealed for VestingSchedule {}

impl Pack for VestingSchedule {
    const LEN: usize = 17;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let release_time_bytes = self.release_time.to_le_bytes();
        let amount_bytes = self.amount.to_le_bytes();

        for i in 0..8 {
            dst[i] = release_time_bytes[i];
        }

        for i in 8..16 {
            dst[i] = amount_bytes[i - 8];
        }

        dst[16] = self.is_released as u8;
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        if src.len() < VestingSchedule::LEN {
            return Err(ProgramError::InvalidAccountData);
        }

        let release_time = u64::from_le_bytes(src[0..8].try_into().unwrap());
        let amount = u64::from_le_bytes(src[8..16].try_into().unwrap());
        let is_released = src[16] == 1;

        Ok(Self {
            release_time,
            amount,
            is_released,
        })
    }
}

impl IsInitialized for VestingScheduleHeader {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

pub fn unpack_schedules(input: &[u8]) -> Result<Vec<VestingSchedule>, ProgramError> {
    let number_of_schedules = input.len() / VestingSchedule::LEN;
    let mut output: Vec<VestingSchedule> = Vec::with_capacity(number_of_schedules);
    let mut offset = 0;

    for _ in 0..number_of_schedules {
        output.push(VestingSchedule::unpack_from_slice(
            &input[offset..offset + VestingSchedule::LEN],
        )?);
        offset += VestingSchedule::LEN;
    }

    Ok(output)
}

pub fn pack_schedules_into_slice(schedules: Vec<VestingSchedule>, target: &mut [u8]) {
    let mut offset = 0;

    for s in schedules.iter() {
        s.pack_into_slice(&mut target[offset..]);
        offset += VestingSchedule::LEN;
    }
}

#[cfg(test)]
mod tests {
    use super::{unpack_schedules, VestingSchedule, VestingScheduleHeader};
    use solana_program::{program_pack::Pack, pubkey::Pubkey};

    #[test]
    fn test_state_packing() {
        let seeds: [u8; 32] = [0; 32];
        let header_state = VestingScheduleHeader {
            seeds,
            destination_address: Pubkey::new_unique(),
            mint_address: Pubkey::new_unique(),
            is_initialized: true,
            total_amount: 1389,
            created_date: 30767976,
        };
        let schedule_state_0 = VestingSchedule {
            release_time: 30767976,
            amount: 969,
            is_released: false,
        };
        let schedule_state_1 = VestingSchedule {
            release_time: 32767076,
            amount: 420,
            is_released: true,
        };

        let state_size = VestingScheduleHeader::LEN + 2 * VestingSchedule::LEN;
        let mut state_array = [0u8; 147];

        header_state.pack_into_slice(&mut state_array[..VestingScheduleHeader::LEN]);
        schedule_state_0.pack_into_slice(
            &mut state_array
                [VestingScheduleHeader::LEN..VestingScheduleHeader::LEN + VestingSchedule::LEN],
        );
        schedule_state_1
            .pack_into_slice(&mut state_array[VestingScheduleHeader::LEN + VestingSchedule::LEN..]);

        let packed = Vec::from(state_array);
        let mut expected = Vec::with_capacity(state_size);

        expected.extend_from_slice(&header_state.seeds);
        expected.extend_from_slice(&header_state.destination_address.to_bytes());
        expected.extend_from_slice(&header_state.mint_address.to_bytes());
        expected.extend_from_slice(&header_state.total_amount.to_le_bytes());
        expected.extend_from_slice(&header_state.created_date.to_le_bytes());
        expected.extend_from_slice(&[header_state.is_initialized as u8]);

        expected.extend_from_slice(&schedule_state_0.release_time.to_le_bytes());
        expected.extend_from_slice(&schedule_state_0.amount.to_le_bytes());
        expected.extend_from_slice(&[schedule_state_0.is_released as u8]);

        expected.extend_from_slice(&schedule_state_1.release_time.to_le_bytes());
        expected.extend_from_slice(&schedule_state_1.amount.to_le_bytes());
        expected.extend_from_slice(&[schedule_state_1.is_released as u8]);

        assert_eq!(expected, packed);
        assert_eq!(packed.len(), state_size);
        let unpacked_header =
            VestingScheduleHeader::unpack(&packed[..VestingScheduleHeader::LEN]).unwrap();

        assert_eq!(unpacked_header, header_state);

        let unpacked_schedules = unpack_schedules(&packed[VestingScheduleHeader::LEN..]).unwrap();

        assert_eq!(unpacked_schedules[0], schedule_state_0);
        assert_eq!(unpacked_schedules[1], schedule_state_1);
    }
}
